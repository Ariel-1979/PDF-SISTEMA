import Header from "@/components/Header"
import FixDates from "@/components/FixDates"

export default function FixDatesPage() {
  return (
    <main>
      <Header />
      <div className="container" style={{ padding: "2rem" }}>
        <FixDates />
      </div>
    </main>
  )
}

