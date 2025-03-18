"use client"

const ClienteForm = ({ cliente, onChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target
    onChange({ ...cliente, [name]: value })
  }

  return (
    <section className="section">
      <h2 className="section-title">CLIENTE</h2>
      <div className="form-row">
        <div className="form-group">
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
        <div className="form-group">
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
        <div className="form-group">
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
        <div className="form-group">
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
      <div className="form-row iva-row">
        <div className="form-group iva-group">
          <label htmlFor="iva" className="form-label">
            IVA
          </label>
          <select id="iva" name="iva" className="form-control" value={cliente.iva} onChange={handleChange}>
            <option value="0%">0%</option>
            <option value="10.5%">10.5%</option>
            <option value="21%">21%</option>
          </select>
        </div>
      </div>
    </section>
  )
}

export default ClienteForm

