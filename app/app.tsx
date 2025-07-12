import { Mainbar } from './components/mainbar/mainbar';
import { useState } from 'react';
import { MainPane } from './components/panes/mainPane';

export default function App() {
  const [toggleMainPane, setToggleMainPane] = useState(false)

  return (
    <div className="w-full h-full flex flex-col items-center justify-start gap-1 pt-2 overflow-y-hidden">
      <Mainbar toggleMainPane={() => setToggleMainPane(!toggleMainPane)} />
      {toggleMainPane && <MainPane />}
    </div>
  )
}