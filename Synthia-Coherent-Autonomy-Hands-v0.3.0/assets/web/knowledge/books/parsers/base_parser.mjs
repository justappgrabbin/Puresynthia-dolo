export class BookParser {
  constructor({ id, sourceType, defaultDimension = null }) {
    this.id = id;
    this.sourceType = sourceType;
    this.defaultDimension = defaultDimension;
  }

  supports(_input, _meta = {}) {
    return false;
  }

  parse(_input, _meta = {}) {
    throw new Error(`${this.constructor.name}.parse() is not implemented`);
  }

  record({ id, gate, text, dimension = this.defaultDimension, section = null, page = null, dependsOn = [], relation = null, attributes = {}, wordLevel = true, kind = null }) {
    return {
      id,
      ...(kind ? { kind } : {}),
      wordLevel,
      gate,
      text,
      dimension,
      dependsOn: [...dependsOn],
      relation,
      source: {
        parser: this.id,
        sourceType: this.sourceType,
        section,
        page,
      },
      attributes: { ...attributes },
    };
  }
}
