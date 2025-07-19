let userTypeStorage: { [email: string]: string } = {};

export const saveUserType = (email: string, userType: string) => {
  userTypeStorage[email] = userType;
  console.log(`Tipo de usuário salvo para ${email}: ${userType}`);
};

export const getUserType = (email: string): string | null => {
  return userTypeStorage[email] || null;
};

export const clearUserType = (email: string) => {
  delete userTypeStorage[email];
}; 