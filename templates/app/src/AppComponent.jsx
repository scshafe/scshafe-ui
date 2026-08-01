import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Panel, Scroll, TabPanelHeader, Title } from "mc-ui";
import { ToastTray, showToastThunk } from "mc-ui/state";
import { ExampleManager, fetchExampleThunk, selectExample } from "./state/ExampleManager.js";

// The workspace frame contract (see mc-ui layout.css): chrome stays pinned,
// bodies scroll. The shell is --contained here; drop the modifier for a
// document-scroll page.
export function AppComponent() {
  const dispatch = useDispatch();
  const example = useSelector(selectExample);
  React.useEffect(() => {
    dispatch(fetchExampleThunk());
  }, [dispatch]);
  return (
    <div className="mc-app-frame">
      <header style={{ padding: "14px 24px", borderBottom: "1px solid var(--line)" }}>
        <Title level={1}>__APP_NAME__</Title>
      </header>
      <main className="mc-app-shell mc-app-shell--contained" style={{ padding: 16 }}>
        <div className="mc-workspace-panel">
          <TabPanelHeader
            title="Example"
            statusLabel={example.status}
            refresh={{ label: "Refresh example", onClick: () => dispatch(fetchExampleThunk()) }}
          />
          <Scroll axis="y" className="mc-fill">
            <Panel>
              <p>Example resource: {example.status}{example.data ? ` — ${JSON.stringify(example.data)}` : ""}</p>
              <Button label="Toast it" icon="action.send" onClick={() => dispatch(showToastThunk({ message: "Hello from mc-ui/state" }))} />
            </Panel>
          </Scroll>
        </div>
      </main>
      <ToastTray />
    </div>
  );
}
