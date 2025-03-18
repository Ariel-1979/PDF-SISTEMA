import Header from "@/components/Header"
import DbUpdater from "@/components/DbUpdater"

export default function DbUpdatePage() {
  return (
    <main>
      <Header />
      <div className="container" style={{ padding: "2rem" }}>
        <DbUpdater />
      </div>
    </main>
  )
}

