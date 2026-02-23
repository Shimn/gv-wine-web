'use client';

export default function TypingIndicator() {
  return (
    <div className="flex items-start animate-fadeSlideUp">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wine-700 flex items-center justify-center mr-2">
        <span className="text-sm">🍷</span>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-wine-400 animate-dotBounce"
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
