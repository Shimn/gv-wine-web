'use client';

const SUGGESTIONS = [
  'Quantos vinhos tem no estoque?',
  'Me fala sobre o Malbec',
  'Adiciona um Cabernet, Tinto, R$ 89, 10 unidades',
  'Retira 3 unidades do vinho 1',
  'Como estão as vendas?',
  'O que você pode fazer?',
];

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export default function SuggestionChips({ onSelect, disabled }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          disabled={disabled}
          className="text-xs bg-wine-50 text-wine-700 border border-wine-200 rounded-full px-3 py-1.5
                     hover:bg-wine-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
