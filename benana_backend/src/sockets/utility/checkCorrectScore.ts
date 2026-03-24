export const checkCorrectScore = (
  category: string,
  diceHistory: number[][],
) => {
  let calculatedScore = null;

  const diceDistribution = [0, 0, 0, 0, 0, 0];

  for (const dice of diceHistory[diceHistory.length - 1]) {
    diceDistribution[dice - 1]++;
  }

  switch (category) {
    case "ones":
    case "twos":
    case "threes":
    case "fours":
    case "fives":
    case "sixs":
      calculatedScore = checkNormalNumbers(category, diceDistribution);
      break;
    case "threeOfAKind":
      calculatedScore = check3OAK(diceDistribution);
      break;
    case "fourOfAKind":
      calculatedScore = check4OAK(diceDistribution);
      break;
    case "fullHouse":
      calculatedScore = checkFullHouse(diceDistribution);
      break;
    case "smallStraight":
      calculatedScore = checkSmallStraight(diceDistribution);
      break;
    case "largeStraight":
      calculatedScore = checkLargeStraight(diceDistribution);
      break;
    case "kniffel":
      calculatedScore = checkKniffel(diceDistribution);
      break;
    case "chance":
      calculatedScore = calculateChance(diceDistribution);
      break;
  }

  return calculatedScore;
};

const checkNormalNumbers = (category: string, diceDistribution: number[]) => {
  let numberToLookFor = null;
  switch (category) {
    case "ones":
      numberToLookFor = 1;
      break;
    case "twos":
      numberToLookFor = 2;
      break;
    case "threes":
      numberToLookFor = 3;
      break;
    case "fours":
      numberToLookFor = 4;
      break;
    case "fives":
      numberToLookFor = 5;
      break;
    case "sixs":
      numberToLookFor = 6;
      break;
    default:
      break;
  }

  if (!numberToLookFor) return null;
  let score = 0;
  if (numberToLookFor) {
    score = diceDistribution[numberToLookFor - 1] * numberToLookFor;
  }
  return score;
};

const check3OAK = (diceDistribution: number[]) => {
  const hasThreeOfAKind = diceDistribution.some((count) => count >= 3);
  if (hasThreeOfAKind) {
    const score = diceDistribution.reduce((acc, count, index) => acc + count * (index + 1), 0);
    return score;
  }
  return 0;
};

const check4OAK = (diceDistribution: number[]) => {
  const hasFourOfAKind = diceDistribution.some((count) => count >= 4);
  if (hasFourOfAKind) {
    const score = diceDistribution.reduce((acc, count, index) => acc + count * (index + 1), 0);
    return score;
  }
  return 0;
};

const checkFullHouse = (diceDistribution: number[]) => {
  const hasThreeOfAKind = diceDistribution.some((count) => count === 3);
  const hasPair = diceDistribution.some((count) => count === 2);
  if (hasThreeOfAKind && hasPair) {
    return 25; // Full house score
  }
  return 0;
};

const checkSmallStraight = (diceDistribution: number[]) => {
  const hasSmallStraight =
    (diceDistribution[0] >= 1 && diceDistribution[1] >= 1 && diceDistribution[2] >= 1 && diceDistribution[3] >= 1) ||
    (diceDistribution[1] >= 1 && diceDistribution[2] >= 1 && diceDistribution[3] >= 1 && diceDistribution[4] >= 1) ||
    (diceDistribution[2] >= 1 && diceDistribution[3] >= 1 && diceDistribution[4] >= 1 && diceDistribution[5] >= 1);

  if (hasSmallStraight) {
    return 30;
  }
  return 0;
};

const checkLargeStraight = (diceDistribution: number[]) => {
  const hasLargeStraight =
    (diceDistribution[0] === 1 && diceDistribution[1] === 1 && diceDistribution[2] === 1 && diceDistribution[3] === 1 && diceDistribution[4] === 1) ||
    (diceDistribution[1] === 1 && diceDistribution[2] === 1 && diceDistribution[3] === 1 && diceDistribution[4] === 1 && diceDistribution[5] === 1);

  if (hasLargeStraight) {
    return 40; // Large straight score
  }
  return 0;
};

const checkKniffel = (diceDistribution: number[]) => {
  const hasKniffel = diceDistribution.some((count) => count === 5);
  if (hasKniffel) {
    return 50; // Kniffel score
  }
  return 0;
};

const calculateChance = (diceDistribution: number[]) => {
  const score = diceDistribution.reduce((acc, count, index) => acc + count * (index + 1), 0);
  return score;
};