import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { formatBnDate, toBnDigits } from "@/lib/bn";
import { Calendar, TrendingUp, Wallet, Building2, ClipboardList, Waves, Droplet } from "lucide-react";
import { WaterCard } from "@/components/water/WaterCard";
import { WaterStatCard } from "@/components/water/WaterStatCard";
import { useBranches } from "@/lib/branches";
import { DropletBadge } from "@/components/water/DropletIcon";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: branches = [] } = useBranches();
  const name = user?.user_metadata?.full_name ?? "ব্যবহারকারী";
  const today = formatBnDate(new Date());
  const activeBranches = branches.filter((b) => b.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DropletBadge className="droplet-float" />
        <div>
          <h2 className="text-3xl font-semibold text-[#0C4A6E]">স্বাগতম, {name}!</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-[#0369A1]">
            <Calendar className="h-4 w-4" />
            {today}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <WaterStatCard label="আজকের বিক্রয়" value={`৳ ${toBnDigits(0)}`} icon={TrendingUp} tint="primary" />
        <WaterStatCard label="মাসিক রাজস্ব" value={`৳ ${toBnDigits(0)}`} icon={Wallet} tint="cyan" />
        <WaterStatCard label="সক্রিয় শাখা" value={toBnDigits(activeBranches)} icon={Building2} tint="teal" />
        <WaterStatCard label="চলমান অর্ডার" value={toBnDigits(0)} icon={ClipboardList} tint="amber" />
        <WaterStatCard label="জলধারা প্রবাহিত" value="∞" icon={Waves} tint="primary" />
      </div>

      <WaterCard className="p-6">
        <div className="flex items-start gap-4">
          <Droplet className="h-8 w-8 shrink-0 text-[#0EA5E9] droplet-float" fill="#0EA5E9" />
          <div>
            <h3 className="text-lg font-semibold text-[#0C4A6E]">এসকে কর্পোরেশন ইআরপি</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#0369A1]">
              পানি বিশুদ্ধকরণ ব্যবসার সম্পূর্ণ ব্যবস্থাপনা সিস্টেম। শাখাভিত্তিক
              লাভ-ক্ষতি, ইনভেন্টরি, সেলস, সার্ভিস — সবকিছু এক প্ল্যাটফর্মে।
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#0EA5E9]/10 blur-3xl" />
      </WaterCard>
    </div>
  );
}
