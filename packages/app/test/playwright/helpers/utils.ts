export const delay = async (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
