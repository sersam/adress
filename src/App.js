import React, { useCallback, useState } from 'react';
import { debounce } from 'lodash';

function App() {
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [data, setData] = useState([]);
  const [road, setRoad] = useState('');
  const [refCat, setRefCat] = useState(null);

  const handleNumberChange = (e) => {
    setNumber(e.target.value);
  };

  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (query.length > 1) {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${query} ${municipality} ${province}`);
          const data = await response.json();
          setSuggestions(data);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
      }
    }, 500),
    [municipality, province]
  );

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    fetchSuggestions(e.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    setAddress(suggestion.display_name);
    setNumber(suggestion.address.house_number || '');
    setProvince(suggestion.address.province || '');
    setMunicipality(suggestion.address.city || suggestion.address.village || '');
    setRoad(suggestion.address.road || '');
    setSuggestions([]);
  };

  const handleOnSubmit = (e) => {
    e.preventDefault();
    fetch(`http://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/ObtenerNumerero?Provincia=${province}&Municipio=${municipality}&TipoVia=CL&NomVia=MERCADILLO&Numero=${number}`)
      .then((response) => response.json())
      .then((data) => { setData(data.consulta_numereroResult.nump) });
  };

  const getDataRefCat = (value) => {
    fetch(`http://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPRC?Provincia=${province}&Municipio=${municipality}&RefCat=${value}`)
      .then((response) => response.json())
      .then((data) => { setRefCat(data.consulta_dnprcResult.bico) });
  };

  return (
    <div>
      <form onSubmit={handleOnSubmit}>
        <div>
          <label>Dirección:</label>
          <input type="text" value={address} onChange={handleAddressChange} />
          {suggestions.length > 0 && (
            <select size="5">
              {suggestions.map((suggestion, index) => (
                <option key={index} onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion.display_name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label>Provincia:</label>
          <input type="text" value={province} disabled />
        </div>
        <div>
          <label>Municipio:</label>
          <input type="text" value={municipality} disabled />
        </div>
        <div>
          <label>Calle:</label>
          <input type="text" value={road} disabled />
        </div>
        {province && municipality && (
          <div>
            <label>Número:</label>
            <input type="text" value={number} onChange={handleNumberChange} />
          </div>
        )}
        <button type="submit" disabled={!number || !province || !municipality || !road}>Verificar Dirección</button>

      </form>
      <div>

        <label>Resultado:</label>
        <ul>

          {data.length > 0 ? <>
            Dirección Válida.
            <br></br>
            Referencias catastrales en esta dirección:
            <div style={{height: '100px', overflow: 'auto'}}>
            {data.map((item, index) => data.map((item, index) => (
              <li key={index} onClick={() => getDataRefCat(`${item.pc.pc1}${item.pc.pc2}`)} style={{ cursor: 'pointer', padding: '5px', border: '1px solid black' }}>
                {item.pc.pc1}{item.pc.pc2}
              </li>
            )))}
            </div>
          </>
            : <li>No hay resultados</li>}
        </ul>
      </div>
      {
        refCat && <div>
          Información de la referencia catastral:
          <br></br>
          <label>Año: {refCat?.bi?.debi?.ant}</label>
          <br></br>
          <label>Superficie: {refCat?.bi?.debi?.sfc} m2</label>
          <br></br>
          <label>Uso: {refCat?.bi?.debi?.luso}</label>

        </div>
      }
    </div >
  );
}

export default App;
