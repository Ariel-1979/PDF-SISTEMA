"use client"

import styles from "@/styles/OpcionesForm.module.css"

const OpcionesForm = ({ iva, descuento, onChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target
    onChange({ [name]: value })
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>OPCIONES</h2>
      <div className={styles.optionsRow}>
        <div className={styles.formGroup}>
          <label htmlFor="iva" className="form-label">
            IVA
          </label>
          <select id="iva" name="iva" className="form-control" value={iva} onChange={handleChange}>
            <option value="0%">0%</option>
            <option value="10.5%">10.5%</option>
            <option value="21%">21%</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="descuento" className="form-label">
            Descuento
          </label>
          <select id="descuento" name="descuento" className="form-control" value={descuento} onChange={handleChange}>
            <option value="0%">0%</option>
            <option value="5%">5%</option>
            <option value="10%">10%</option>
            <option value="15%">15%</option>
            <option value="20%">20%</option>
            <option value="25%">25%</option>
          </select>
        </div>
      </div>
    </section>
  )
}

export default OpcionesForm

