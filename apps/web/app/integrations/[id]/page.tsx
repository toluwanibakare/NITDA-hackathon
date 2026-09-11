export default function Detail({ params }: { params: { id: string } }) {
  return <div className="space-y-2"><h1 className="text-2xl font-bold">Integration {params.id}</h1><p className="text-slate-400 text-sm">FE-1: Trust Profile + behaviour + violations + Release/Quarantine buttons.</p></div>;
}
