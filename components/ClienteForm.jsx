"use client";

import styles from "@/styles/ClienteForm.module.css";

const ClienteForm = ({ cliente, onChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...cliente, [name]: value });
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>CLIENTE</h2>
      <div className={styles.formRow}>
        <div className={`${styles.formGroup} ${styles.wide}`}>
          <label htmlFor="nombre" className="form-label">
            Cliente
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            className="form-control"
            value={cliente.nombre}
            onChange={handleChange}
          />
        </div>
        <div className={`${styles.formGroup} ${styles.wide}`}>
          <label htmlFor="domicilio" className="form-label">
            Domicilio
          </label>
          <input
            type="text"
            id="domicilio"
            name="domicilio"
            className="form-control"
            value={cliente.domicilio}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className={styles.secondaryRow}>
        <div className={styles.formGroup}>
          <label htmlFor="localidad" className="form-label">
            Localidad
          </label>
          <input
            type="text"
            id="localidad"
            name="localidad"
            className="form-control"
            value={cliente.localidad || ""}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="entreCalles" className="form-label">
            Entre calles
          </label>
          <input
            type="text"
            id="entreCalles"
            name="entreCalles"
            className="form-control"
            value={cliente.entreCalles}
            onChange={handleChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="telefono" className="form-label">
            Teléfono
          </label>
          <input
            type="text"
            id="telefono"
            name="telefono"
            className="form-control"
            value={cliente.telefono}
            onChange={handleChange}
          />
        </div>
      </div>
    </section>
  );
};

export default ClienteForm;
