import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { FlightsPageContent } from "@/components/flights/flights-page-content";
import { listFlights } from "@/lib/flights/queries";
import { type Flight } from "@/lib/flights/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flights — Eric Li",
  description: "Personal flight log and world route map.",
};

export default async function FlightsPage() {
  let initialFlights: Flight[] = [];

  try {
    initialFlights = await listFlights();
  } catch (error) {
    console.error("[flights] Failed to load initial flights:", error);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#04080a]">
      <Navbar />
      <main className="pt-[5.5rem] md:pt-24">
        <FlightsPageContent initialFlights={initialFlights} />
      </main>
    </div>
  );
}
