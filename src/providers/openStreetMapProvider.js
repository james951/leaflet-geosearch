import BaseProvider from './provider';

export default class Provider extends BaseProvider {
  endpoint({ query } = {}) {
    const { params } = this.options;

    const paramString = this.getParamString({
      ...params,
      format: 'json',
      q: query,
    });

    return `https://nominatim.openstreetmap.org/search?${paramString}`;
  }

  endpointReverse({ data } = {}) {
    const { params } = this.options;

    const paramString = this.getParamString({
      ...params,
      format: 'json',
      // eslint-disable-next-line camelcase
      osm_id: data.raw.osm_id,
      // eslint-disable-next-line camelcase
      osm_type: this.translateOsmType(data.raw.osm_type),
    });

    return `https://nominatim.openstreetmap.org/reverse?${paramString}`;
  }

  parse({ data }) {
    let keyword = this.options.params ? this.options.params.keyword : null;
    let filteredData = data;

    if (keyword) {
      filteredData = data.filter(x => x.display_name.includes(keyword));
    }

    return filteredData.map(r => ({
      x: r.lon,
      y: r.lat,
      label: r.display_name,
      bounds: [
        [parseFloat(r.boundingbox[0]), parseFloat(r.boundingbox[2])], // s, w
        [parseFloat(r.boundingbox[1]), parseFloat(r.boundingbox[3])], // n, e
      ],
      raw: r,
    }));
  }

  async search({ query, data }) {
    // eslint-disable-next-line no-bitwise
    const protocol = ~location.protocol.indexOf('http') ? location.protocol : 'https:';

    const url = data
      ? this.endpointReverse({ data, protocol })
      : this.endpoint({ query, protocol });

    const request = await fetch(url);
    const json = await request.json();
    return this.parse({ data: data ? [json] : json });
  }

  translateOsmType(type) {
    if (type === 'node') return 'N';
    if (type === 'way') return 'W';
    if (type === 'relation') return 'R';
    return ''; // Unknown
  }
}
