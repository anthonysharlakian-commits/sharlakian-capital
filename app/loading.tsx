export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-7 w-40 bg-[rgba(201,168,76,0.08)] rounded-[2px]" />
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="panel h-20 bg-[rgba(201,168,76,0.04)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        <div className="panel h-52 bg-[rgba(201,168,76,0.04)]" />
        <div className="panel h-52 bg-[rgba(201,168,76,0.04)]" />
      </div>
    </div>
  );
}
