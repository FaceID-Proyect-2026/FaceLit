export type InstructorType = 'especifico' | 'transversal';

export const InstructorService = {
  async update(idInstructor: string | number, nuevoTipo: InstructorType, nuevaListaProgramas: string[] = []) {
    if (nuevoTipo === 'especifico' && nuevaListaProgramas.length === 0) {
      throw new Error('Un instructor específico debe tener al menos un programa asociado.');
    }

    if (nuevoTipo === 'transversal') {
      return {
        idInstructor,
        tipo: 'transversal',
        programas: [],
        ok: true,
      };
    }

    return {
      idInstructor,
      tipo: 'especifico',
      programas: nuevaListaProgramas,
      ok: true,
    };
  },
};

export default InstructorService;
