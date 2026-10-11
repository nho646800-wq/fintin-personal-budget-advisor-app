import { redirect } from "next/navigation";
import DashboardView from "@/app/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;
  const data = await getDashboardData({
    from: firstParam(searchParams.from),
    to: firstParam(searchParams.to),
  });

  return <DashboardView {...data} />;
}
