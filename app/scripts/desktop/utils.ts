export const flattenMessage = (data: any) => {
  let output;

  try {
    const stream = data.name;
    const multiplexData = data.data;
    const nestedStream = multiplexData?.name;
    const nestedData = multiplexData?.data;
    const method = nestedData?.method;
    const result = nestedData?.result;

    output = {};
    output = { ...output, ...(stream ? { stream } : {}) };
    output = { ...output, ...(nestedStream ? { type: nestedStream } : {}) };
    output = { ...output, ...(method ? { method } : {}) };
    output = { ...output, ...(result ? { isResult: true } : {}) };
  } catch {
    output = data;
  }

  return output;
};
