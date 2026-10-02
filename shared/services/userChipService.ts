export const UserChipService = {
  async transferChip(idUser: string | number, idNuevaFicha: string) {
    if (!idNuevaFicha || !String(idNuevaFicha).trim()) {
      throw new Error('Debe indicar una ficha válida para trasladar al aprendiz.');
    }

    return {
      idUser,
      idNuevaFicha,
      ok: true,
    };
  },

  async getHistory(idUser: string | number) {
    return {
      idUser,
      history: [],
      active: null,
    };
  },
};

export default UserChipService;
