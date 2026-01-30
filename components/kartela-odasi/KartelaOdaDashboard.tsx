'use client';

export default function KartelaOdaDashboard({ roomName }: { roomName: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{roomName}</h1>
      <p className="text-gray-600">Bu ekran geliştirme aşamasındadır.</p>
    </div>
  );
}
