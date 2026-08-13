import { getRakList, getDusList, getPembungkusList } from "@/app/actions/location-actions";
import LocationsManager from "@/components/locations-manager";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const [rawRakList, rawDusList, rawPembungkusList] = await Promise.all([
    getRakList(),
    getDusList(),
    getPembungkusList(),
  ]);

  const rakList = JSON.parse(JSON.stringify(rawRakList));
  const dusList = JSON.parse(JSON.stringify(rawDusList));
  const pembungkusList = JSON.parse(JSON.stringify(rawPembungkusList));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Lokasi Fisik</h2>
        <p className="text-sm text-muted-foreground">
          Kelola rak, dus, dan pembungkus untuk memetakan lokasi fisik bukti pemindahbukuan.
        </p>
      </div>

      <LocationsManager
        initialRakList={rakList}
        initialDusList={dusList}
        initialPembungkusList={pembungkusList}
      />
    </div>
  );
}
