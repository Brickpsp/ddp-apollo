import { getOperationAST } from 'graphql/utilities/getOperationAST';

export const isSubscription = (operation) => {
  const { query, operationName } = operation;
  const operationAST = getOperationAST(query, operationName);

  return !!operationAST && operationAST.operation === 'subscription';
};
