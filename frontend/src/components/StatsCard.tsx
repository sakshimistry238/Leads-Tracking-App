interface Props {
  label: string;
  value: number | string;
  color: 'blue' | 'yellow' | 'green' | 'red' | 'gray';
  icon: string; // SVG path content passed as string
}

const colorMap: Record<Props['color'], string> = {
  blue:   'stats-card--blue',
  yellow: 'stats-card--yellow',
  green:  'stats-card--green',
  red:    'stats-card--red',
  gray:   'stats-card--gray',
};

export default function StatsCard({ label, value, color, icon }: Props) {
  return (
    <div className={`stats-card ${colorMap[color]}`}>
      <div className="stats-card__icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: icon }} />
      <div className="stats-card__body">
        <span className="stats-card__value">{value}</span>
        <span className="stats-card__label">{label}</span>
      </div>
    </div>
  );
}
