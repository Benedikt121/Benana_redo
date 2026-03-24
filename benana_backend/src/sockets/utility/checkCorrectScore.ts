export const checkCorrectScore = (
  category: string,
  score: number,
  diceHistory: number[][],
) => {
  let calculatedScore = null;

  if (
    category === "ones" ||
    category === "twos" ||
    category === "threes" ||
    category === "fours" ||
    category === "fives" ||
    category === "sixs"
  ) {
    calculatedScore = checkNormalNumbers(category, diceHistory);
  }

  const isScoreRight = score === calculatedScore;

  if (isScoreRight) {
    return { isScoreRight, score };
  } else {
    return { isScoreRight, score: calculatedScore };
  }
};

const checkNormalNumbers = (category: string, diceHistory: number[][]) => {
  let numberToLookFor = null;
  switch (category) {
    case "ones":
      numberToLookFor = 1;
    case "twos":
      numberToLookFor = 2;
    case "threes":
      numberToLookFor = 3;
    case "fours":
      numberToLookFor = 4;
    case "fives":
      numberToLookFor = 5;
    case "sixs":
      numberToLookFor = 6;
    default:
      break;
  }

  if (!numberToLookFor) return null;

  let score = 0;

  for (const dice of diceHistory[diceHistory.length - 1]) {
    if (dice === numberToLookFor) {
      score = +dice;
    }
  }

  return score;
};
