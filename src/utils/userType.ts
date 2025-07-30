let userTypeStorage: { [email: string]: string } = {};

export const saveUserType = (email: string, userType: string) => {
  try {
    userTypeStorage[email] = userType;
    console.log(`Tipo de usuário salvo: ${userType} para ${email}`);
  } catch (error) {
    console.error('Erro ao salvar tipo de usuário:', error);
  }
};

export const getUserType = (email: string): string | null => {
  return userTypeStorage[email] || null;
};

export const clearUserType = (email: string) => {
  delete userTypeStorage[email];
}; 