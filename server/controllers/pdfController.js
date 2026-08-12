import puppeteer from 'puppeteer';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Lesson from '../models/Lesson.js';

/* =====================================================
   GET /api/courses/:id/certificate
   Generate PDF certificate for course
===================================================== */
export async function generateCertificatePDF(req, res) {
  let browser;
  try {
    const courseId = req.params.id;
    const auth0Id = req.auth?.sub;

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const user = await User.findOne({ auth0Id }).lean();
    const userName = user?.name || "Learner";

    const dateString = new Date().toLocaleDateString();

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Certificate</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { margin: 0; padding: 0; background-color: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh; overflow: hidden; }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;600;700&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        * { font-family: 'Inter', sans-serif; }
      </style>
    </head>
    <body>
      <div class="relative w-[1000px] h-[707px] bg-[#0a0a0a] border-4 border-gray-800 p-3 shadow-2xl">
        <div class="w-full h-full border-2 border-gray-700 p-12 flex flex-col items-center text-center relative overflow-hidden">
          
          <!-- Background watermark/glow -->
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 to-transparent rounded-full pointer-events-none"></div>

          <!-- Header -->
          <div class="mb-10 relative z-10 mt-8">
            <h1 class="text-6xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 uppercase tracking-[0.2em]">
              Certificate
            </h1>
            <p class="text-sm text-emerald-400/80 tracking-[0.4em] uppercase mt-4">
              of Completion
            </p>
          </div>

          <!-- Content -->
          <div class="flex-1 flex flex-col justify-center items-center w-full relative z-10">
            <p class="text-gray-400 text-sm mb-4">This is to certify that</p>
            <h2 class="text-5xl font-bold text-white mb-8 border-b border-gray-800 pb-4 min-w-[500px] px-8">
              ${userName}
            </h2>

            <p class="text-gray-400 text-sm mb-4">has successfully completed the AI-generated course</p>
            <h3 class="text-3xl font-bold text-emerald-400 mb-8 max-w-2xl">
              ${course.topic}
            </h3>

            <p class="text-gray-500 text-sm max-w-xl mx-auto">
              Demonstrating proficiency at the <span class="text-gray-300 font-semibold">${course.level}</span> level in <span class="text-gray-300 font-semibold">${course.language}</span>.
            </p>
          </div>

          <!-- Footer -->
          <div class="w-full flex justify-between items-end mt-12 relative z-10 border-t border-gray-800/50 pt-8 pb-4 px-8">
            <div class="text-left">
              <p class="text-white text-lg font-bold">Text-to-Learn</p>
              <p class="text-xs text-gray-500">AI Learning Platform</p>
            </div>

            <div class="w-20 h-20 rounded-full border border-gray-700 flex items-center justify-center bg-[#0a0a0a]">
              <span class="text-4xl">🏆</span>
            </div>

            <div class="text-right">
              <p class="text-white text-lg font-bold">
                ${dateString}
              </p>
              <p class="text-xs text-gray-500">Date of Achievement</p>
            </div>
          </div>

        </div>
      </div>
    </body>
    </html>
    `;

    browser = await puppeteer.launch({ 
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 707 });
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBytes = await page.pdf({
      width: '1000px',
      height: '707px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    const pdfBuffer = Buffer.from(pdfBytes);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${course.topic.replace(/\s+/g, '_')}_Certificate.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Certificate PDF generation error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate certificate PDF" });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/* =====================================================
   GET /api/courses/:id/pdf
   Generate full course content PDF
===================================================== */
export async function generateCoursePDF(req, res) {
  let browser;
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId).lean();
    
    if (!course || !course.content) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const { courseTitle, description, modules } = course.content;
    
    // Fetch all generated lessons for this course
    const allLessons = await Lesson.find({ courseId }).lean();

    let modulesHtml = '';
    
    modules.forEach((mod, idx) => {
      modulesHtml += `<div class="module-section">
        <h2 class="text-3xl font-bold text-emerald-400 mt-12 mb-6 border-b border-gray-700 pb-2">Module ${idx + 1}: ${mod.moduleTitle}</h2>`;
        
      mod.lessons.forEach((lessonObj, lIdx) => {
        const titleText = typeof lessonObj === 'object' ? (lessonObj.title || 'Lesson') : lessonObj;
        
        // Find the matching lesson document
        const lessonDoc = allLessons.find(l => l.moduleIndex === idx && l.lessonIndex === lIdx);
        
        let contentHtml = '<p class="text-gray-500 italic">This lesson has not been generated yet.</p>';
        
        if (lessonDoc && lessonDoc.content) {
          let c = lessonDoc.content;
          
          if (typeof c === 'string') {
            contentHtml = c
              .replace(/### (.*)/g, '<h4 class="text-xl font-bold text-white mt-6 mb-3">$1</h4>')
              .replace(/## (.*)/g, '<h3 class="text-2xl font-bold text-gray-200 mt-8 mb-4">$1</h3>')
              .replace(/# (.*)/g, '<h2 class="text-3xl font-bold text-emerald-400 mt-10 mb-5">$1</h2>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-emerald-300">$1</strong>')
              .replace(/\n/g, '<br/>');
          } else {
            // It's a JSON object
            let htmlParts = [];
            
            // Handle content array
            const blocks = Array.isArray(c) ? c : (c.content || []);
            if (Array.isArray(blocks)) {
              blocks.forEach(block => {
                if (block.type === 'heading') {
                  htmlParts.push(`<h3 class="text-2xl font-bold text-emerald-400 mt-8 mb-4">${block.text}</h3>`);
                } else if (block.type === 'paragraph') {
                  htmlParts.push(`<p class="text-gray-300 leading-relaxed mb-4">${block.text}</p>`);
                } else if (block.type === 'code') {
                  const codeText = (block.code || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
                  htmlParts.push(`<div class="bg-gray-800 p-4 rounded-lg my-4 font-mono text-sm text-emerald-300 overflow-x-auto whitespace-pre-wrap">${codeText}</div>`);
                } else if (block.type === 'video') {
                  htmlParts.push(`<div class="bg-gray-800 p-4 rounded-lg my-4 border border-gray-700">
                    <p class="text-gray-400 text-sm mb-1">Recommended Video Search:</p>
                    <p class="text-emerald-400 font-semibold">${block.query}</p>
                  </div>`);
                }
              });
            }
            
            // Handle MCQs
            if (c.mcqs && Array.isArray(c.mcqs) && c.mcqs.length > 0) {
              htmlParts.push(`<h4 class="text-xl font-bold text-white mt-8 mb-4 border-b border-gray-700 pb-2">Quiz Questions</h4>`);
              c.mcqs.forEach((mcq, mIdx) => {
                htmlParts.push(`
                  <div class="bg-gray-800 p-4 rounded-lg my-4 border border-gray-700 break-inside-avoid">
                    <p class="font-semibold text-gray-200 mb-2">Q${mIdx + 1}: ${mcq.question}</p>
                    <ul class="list-disc pl-5 mb-3 text-gray-400">
                      ${(mcq.options || []).map(opt => `<li>${opt}</li>`).join('')}
                    </ul>
                    <p class="text-emerald-400 font-semibold text-sm">Correct Answer: ${mcq.correctAnswer}</p>
                    ${mcq.explanation ? `<p class="text-gray-500 text-sm mt-2"><i>Explanation:</i> ${mcq.explanation}</p>` : ''}
                  </div>
                `);
              });
            }
            
            contentHtml = htmlParts.join('') || JSON.stringify(c);
          }
        }

        modulesHtml += `
          <div class="lesson-section mb-10 p-6 bg-gray-900 rounded-lg border border-gray-800 break-inside-avoid">
            <h3 class="text-2xl font-bold text-white mb-4">Lesson ${lIdx + 1}: ${titleText}</h3>
            <div class="text-gray-300 leading-relaxed text-sm">
              ${contentHtml}
            </div>
          </div>
        `;
      });
      
      modulesHtml += `</div>`;
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${courseTitle}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { background-color: #0a0a0a; color: #e5e7eb; font-family: 'Inter', sans-serif; padding: 40px; }
        .page-break { page-break-before: always; }
        .break-inside-avoid { break-inside: avoid; }
      </style>
    </head>
    <body class="max-w-4xl mx-auto">
      <div class="text-center mt-12 mb-20">
        <p class="text-emerald-500 uppercase tracking-widest text-sm font-semibold mb-4">Text-to-Learn Course</p>
        <h1 class="text-5xl font-bold text-white mb-6 leading-tight">${courseTitle}</h1>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto">${description}</p>
        
        <div class="mt-12 inline-block border border-gray-800 rounded-lg p-6 bg-gray-900/50">
          <p class="text-gray-300"><span class="font-semibold text-emerald-400">Topic:</span> ${course.topic}</p>
          <p class="text-gray-300 mt-2"><span class="font-semibold text-emerald-400">Level:</span> ${course.level}</p>
          <p class="text-gray-300 mt-2"><span class="font-semibold text-emerald-400">Language:</span> ${course.language}</p>
        </div>
      </div>
      
      <div class="page-break"></div>
      
      ${modulesHtml}
    </body>
    </html>
    `;

    browser = await puppeteer.launch({ 
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });
    
    const pdfBuffer = Buffer.from(pdfBytes);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${courseTitle.replace(/\s+/g, '_')}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Course PDF generation error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate course PDF" });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
