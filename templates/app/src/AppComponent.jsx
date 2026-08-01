import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Panel, Title } from "mc-ui";
import { ToastTray, showToastThunk } from "mc-ui/state";
import { ExampleManager, fetchExampleThunk, selectExample } from "./state/ExampleManager.js";

export function AppComponent() {
  const dispatch = useDispatch();
  const example = useSelector(selectExample);
  React.useEffect(() => {
    dispatch(fetchExampleThunk());
  }, [dispatch]);
  return (
    <main style={{ padding: 24, display: "grid", gap: 16, maxWidth: 720, margin: "0 auto" }}>
      <Title level={1}>__APP_NAME__</Title>
      <Panel>
        <p>Example resource: {example.status}{example.data ? ` — ${JSON.stringify(example.data)}` : ""}</p>
        <Button label="Toast it" icon="action.send" onClick={() => dispatch(showToastThunk({ message: "Hello from mc-ui/state" }))} />
      </Panel>
      <ToastTray />
    </main>
  );
}
