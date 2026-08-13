import { getVouchers } from "@/app/actions/voucher-actions";
import { getRakList, getDusList, getPembungkusList } from "@/app/actions/location-actions";
import { getUserList } from "@/app/actions/user-actions";
import VouchersManager from "@/components/vouchers-manager";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    rakId?: string;
    dusId?: string;
    pembungkusId?: string;
    tahun?: string;
    bulan?: string;
    isVerified?: string;
    statusKeberadaan?: string;
  }>;
}

export default async function VouchersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [rawVouchersList, rawRakList, rawDusList, rawPembungkusList, rawUserList] = await Promise.all([
    getVouchers(params),
    getRakList(),
    getDusList(),
    getPembungkusList(),
    getUserList(),
  ]);

  const vouchersList = JSON.parse(JSON.stringify(rawVouchersList));
  const rakList = JSON.parse(JSON.stringify(rawRakList));
  const dusList = JSON.parse(JSON.stringify(rawDusList));
  const pembungkusList = JSON.parse(JSON.stringify(rawPembungkusList));
  const userList = JSON.parse(JSON.stringify(rawUserList));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Arsip Nota</h2>
        <p className="text-sm text-muted-foreground">
          Cari, saring, dan kelola dokumen digital & lokasi fisik nota.
        </p>
      </div>

      <VouchersManager
        vouchers={vouchersList}
        rakList={rakList}
        dusList={dusList}
        pembungkusList={pembungkusList}
        userList={userList}
        currentFilters={params}
      />
    </div>
  );
}
