interface LumioLogoProps {
  subtitle?: string;
}

export function LumioLogo({ subtitle }: LumioLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-3 w-3 shrink-0 rounded-full bg-[#c2622a]"
        style={{ boxShadow: '0 0 0 3px #ffffff, 0 0 0 4px rgba(194, 98, 42, 0.25)' }}
      />
      <div>
        <p className="font-serif text-sm font-bold text-[#2c1810]">Lumio</p>
        {subtitle && <p className="text-xs text-[#6b5c52]">{subtitle}</p>}
      </div>
    </div>
  );
}
