"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  Dispatch,
} from "react";

export interface State {
  user: any | null;
  cart: any[];
}

export type Action =
  | { type: "SET_USER"; user: any | null }
  | { type: "SET_CART"; cart: any[] }
  | { type: "ADD_TO_CART"; item: any }
  | { type: "REMOVE_FROM_CART"; index: number }
  | { type: "EMPTY_CART" };

const initialState: State = {
  user: null,
  cart: [],
};

const rootReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.user };
    case "SET_CART":
      return { ...state, cart: action.cart || [] };
    case "ADD_TO_CART":
      return { ...state, cart: [...state.cart, action.item] };
    case "REMOVE_FROM_CART": {
      const newCart = [...state.cart];
      newCart.splice(action.index, 1);
      return { ...state, cart: newCart };
    }
    case "EMPTY_CART":
      return { ...state, cart: [] };
    default:
      return state;
  }
};

type StateContextValue = [State, Dispatch<Action>];

const StateContext = createContext<StateContextValue | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
}

export const StateProvider: React.FC<ProviderProps> = ({ children }) => {
  const value = useReducer(rootReducer, initialState);
  return (
    <StateContext.Provider value={value}>{children}</StateContext.Provider>
  );
};

export const useStateValue = () => {
  const ctx = useContext(StateContext);
  if (!ctx) {
    throw new Error("useStateValue must be used within a StateProvider");
  }
  return ctx;
};
