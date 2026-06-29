import "server-only";

import fs from "fs";
import path from "path";
import {
  MOCK_PROPERTIES,
  MOCK_DEAL_ANALYSES,
  MOCK_TENANTS,
  MOCK_MAINTENANCE,
  MOCK_AGENT_LOGS,
  MOCK_TRANSACTIONS,
} from "@/lib/mock-data";
import { DEFAULT_ACQUISITION_CRITERIA } from "@/lib/constants/acquisition-defaults";
import type {
  Property,
  DealAnalysis,
  Tenant,
  MaintenanceRequest,
  AgentLog,
  Transaction,
  AcquisitionCriteria,
} from "@/lib/types/database";

const STORE_PATH = path.join(process.cwd(), ".data", "mock-store.json");

interface MockStore {
  properties: Property[];
  dealAnalyses: DealAnalysis[];
  tenants: Tenant[];
  maintenance: MaintenanceRequest[];
  agentLogs: AgentLog[];
  transactions: Transaction[];
  acquisitionCriteria: AcquisitionCriteria;
}

function defaultStore(): MockStore {
  return {
    properties: structuredClone(MOCK_PROPERTIES),
    dealAnalyses: structuredClone(MOCK_DEAL_ANALYSES),
    tenants: structuredClone(MOCK_TENANTS),
    maintenance: structuredClone(MOCK_MAINTENANCE),
    agentLogs: structuredClone(MOCK_AGENT_LOGS),
    transactions: structuredClone(MOCK_TRANSACTIONS),
    acquisitionCriteria: structuredClone(DEFAULT_ACQUISITION_CRITERIA),
  };
}

function readStore(): MockStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf8");
      return { ...defaultStore(), ...JSON.parse(raw) };
    }
  } catch {
    // fall through
  }
  return defaultStore();
}

function writeStore(store: MockStore) {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function getMockStore(): MockStore {
  return readStore();
}

export function updateMockProperty(id: string, updates: Partial<Property>) {
  const store = readStore();
  const idx = store.properties.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.properties[idx] = {
    ...store.properties[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  writeStore(store);
  return store.properties[idx];
}

export function addMockMaintenanceRequest(
  request: Omit<MaintenanceRequest, "id" | "created_at" | "submitted_at">
) {
  const store = readStore();
  const newRequest: MaintenanceRequest = {
    ...request,
    id: `maint-${Date.now()}`,
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  store.maintenance.unshift(newRequest);
  writeStore(store);
  return newRequest;
}

export function addMockAgentLog(log: Omit<AgentLog, "id" | "created_at">) {
  const store = readStore();
  const newLog: AgentLog = {
    ...log,
    id: `log-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  store.agentLogs.unshift(newLog);
  writeStore(store);
  return newLog;
}

export function updateMockAcquisitionCriteria(updates: Partial<AcquisitionCriteria>) {
  const store = readStore();
  store.acquisitionCriteria = {
    ...store.acquisitionCriteria,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  writeStore(store);
  return store.acquisitionCriteria;
}

export function updateMockMaintenanceRequest(
  id: string,
  updates: Partial<MaintenanceRequest>
) {
  const store = readStore();
  const idx = store.maintenance.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  store.maintenance[idx] = { ...store.maintenance[idx], ...updates };
  writeStore(store);
  return store.maintenance[idx];
}

export function getMockMaintenanceRequest(id: string) {
  return readStore().maintenance.find((m) => m.id === id) ?? null;
}

export function resetMockStore() {
  writeStore(defaultStore());
}
