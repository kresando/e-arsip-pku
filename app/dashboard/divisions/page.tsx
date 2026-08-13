import { getDivisionList } from "@/app/actions/division-actions";
import DivisionsManager from "@/components/divisions-manager";

export const dynamic = "force-dynamic";

export default async function DivisionsPage() {
  const rawDivisionsList = await getDivisionList();
  const divisionsList = JSON.parse(JSON.stringify(rawDivisionsList));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Kelola Divisi</h2>
        <p className="text-sm text-muted-foreground">
          Kelola unit atau divisi peminjam bukti pemindahbukuan.
        </p>
      </div>

      <DivisionsManager divisions={divisionsList} />
    </div>
  );
}
