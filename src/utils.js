// Using a bigger version of Episilon than Number.Epsilon
// since the function is meant to be used for comparing
// currentTime in videos
const Epsilon = 0.0001;

export const timeAlmostEqual = (num1, num2) => {
  const almost = Math.abs(num1 - num2) < Epsilon;

  return almost;
};
