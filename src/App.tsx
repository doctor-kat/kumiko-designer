import { useAppStore } from './store';
import { LibraryView } from './components/Library';
import { PatternEditor } from './components/PatternEditor';
import { PanelDesigner } from './components/PanelDesigner';

function App() {
  const { currentView } = useAppStore();
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-stone-900 text-stone-200">
      {currentView === 'library' && <LibraryView />}
      {currentView === 'pattern-editor' && <PatternEditor />}
      {currentView === 'panel-designer' && <PanelDesigner />}
    </div>
  );
}

export default App;
