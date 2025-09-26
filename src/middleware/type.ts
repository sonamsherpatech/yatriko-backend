import { Request } from "express";

export interface IExtendedRequest extends Request {
  currentUser?: {
    id: string;
    currentOrganizationNumber?: string | number | null;
  };
}
