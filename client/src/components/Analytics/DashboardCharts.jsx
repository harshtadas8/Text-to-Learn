import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardCharts({ quizHistory = [], learningTime = 0 }) {
  
  // Format quiz history data
  const data = quizHistory.map((q, i) => ({
    name: `Quiz ${i + 1}`,
    score: Math.round((q.score / q.total) * 100) || 0,
    date: new Date(q.date).toLocaleDateString(),
  }));

  // If no quiz history, show empty state
  if (data.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-8 mt-8 text-center text-gray-500">
        <p>No analytics available yet. Complete some quizzes to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      {/* Quiz Scores Over Time */}
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-light text-gray-200 mb-6">Quiz Score Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
                itemStyle={{ color: '#34d399' }}
              />
              <Line type="monotone" dataKey="score" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399', strokeWidth: 2, stroke: '#064e3b' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Learning Time */}
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 flex flex-col justify-center items-center text-center">
        <h3 className="text-lg font-light text-gray-200 mb-2 w-full text-left">Total Learning Time</h3>
        <div className="w-full flex-1 flex flex-col items-center justify-center">
           <div className="text-6xl font-light text-emerald-400 mb-2">{learningTime}</div>
           <div className="text-gray-500 uppercase tracking-widest text-sm font-medium">Minutes Spent Learning</div>
           <p className="text-gray-600 mt-4 text-xs max-w-[200px]">Keep up the great work! Consistent learning time leads to better mastery.</p>
        </div>
      </div>
    </div>
  );
}
