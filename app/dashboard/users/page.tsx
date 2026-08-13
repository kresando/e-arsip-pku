import { getUserList } from "@/app/actions/user-actions";
import UsersManager from "@/components/users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const rawUsersList = await getUserList();
  const usersList = JSON.parse(JSON.stringify(rawUsersList));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Kelola User</h2>
        <p className="text-sm text-muted-foreground">
          Kelola user/petugas pengarsipan untuk PT. Bank SulutGo.
        </p>
      </div>

      <UsersManager users={usersList} />
    </div>
  );
}
