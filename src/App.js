import React, { useCallback, useState } from 'react';
import { debounce } from 'lodash';
import { TextField, Button, Autocomplete, FormControl, Typography, Box, List, ListItem, ListItemText } from '@mui/material';

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
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleAddressChange = (e, value) => {
    setAddress(value);
    fetchSuggestions(value);
  };

  const handleSuggestionClick = (event, suggestion) => {
    if (suggestion) {
      setAddress(suggestion.display_name);
      setNumber(suggestion.address.house_number || '');
      setProvince(suggestion.address.province || '');
      setMunicipality(suggestion.address.city || suggestion.address.village || '');
      setRoad(suggestion.address.road || '');
      setSuggestions([]);
    }
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
    <Box sx={{ p: 2 }}>
      <form onSubmit={handleOnSubmit}>
        <FormControl fullWidth margin="normal">
          <Autocomplete
            freeSolo
            options={suggestions}
            getOptionLabel={(option) => option.display_name}
            onInputChange={handleAddressChange}
            onChange={handleSuggestionClick}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Dirección"
                value={address}
              />
            )}
          />
        </FormControl>
        <FormControl fullWidth margin="normal">
          <TextField
            label="Provincia"
            value={province}
            disabled
          />
        </FormControl>
        <FormControl fullWidth margin="normal">
          <TextField
            label="Municipio"
            value={municipality}
            disabled
          />
        </FormControl>
        <FormControl fullWidth margin="normal">
          <TextField
            label="Calle"
            value={road}
            disabled
          />
        </FormControl>
        {province && municipality && (
          <FormControl fullWidth margin="normal">
            <TextField
              label="Número"
              value={number}
              onChange={handleNumberChange}
            />
          </FormControl>
        )}
        <Button type="submit" variant="contained" color="primary" disabled={!number || !province || !municipality || !road}>
          Verificar Dirección
        </Button>
      </form>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Resultado:</Typography>
        <List>
          {data.length > 0 ? (
            <>
              <Typography>Dirección Válida.</Typography>
              <Typography>Referencias catastrales en esta dirección:</Typography>
              <Box sx={{ overflow: 'auto' }}>
                {data.map((item, index) => (
                  <ListItem key={index} component={'button'} onClick={() => getDataRefCat(`${item.pc.pc1}${item.pc.pc2}`)}>
                    <ListItemText primary={`${item.pc.pc1}${item.pc.pc2}`} />
                  </ListItem>
                ))}
              </Box>
            </>
          ) : (
            <ListItem>
              <ListItemText primary="No hay resultados" />
            </ListItem>
          )}
        </List>
      </Box>
      {refCat && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Información de la referencia catastral:</Typography>
          <Typography>Año: {refCat?.bi?.debi?.ant}</Typography>
          <Typography>Superficie: {refCat?.bi?.debi?.sfc} m2</Typography>
          <Typography>Uso: {refCat?.bi?.debi?.luso}</Typography>
        </Box>
      )}
    </Box>
  );
}

export default App;