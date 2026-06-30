-- Reset agents: 5 agents, all idle (no duplicates)
DELETE FROM agents;

INSERT INTO agents (agent_name, status) VALUES
  ('Deal Scanner', 'idle'),
  ('Underwriter', 'idle'),
  ('Market Intel', 'idle'),
  ('Tenant Screener', 'idle'),
  ('Refi Monitor', 'idle');
