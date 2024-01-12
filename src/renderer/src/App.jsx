import {
  createHashRouter,
  RouterProvider
} from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Home from './Home';
import MediaPage from './MediaPage';
import VideoPage from './VideoPage';
import SearchPage from './SearchPage';
import HistoryPage from './HistoryPage';

function App() {
  const router = createHashRouter([
    {
      path: '/',
      element: <Home />
    },
    {
      path: '/media-page',
      element: <MediaPage />
    },
    {
      path: '/video-page',
      element: <VideoPage />
    },
    {
      path: '/search-page',
      element: <SearchPage />
    },
    {
      path: '/history-page',
      element: <HistoryPage />
    }
  ]);

  return (
    <ChakraProvider>
      <RouterProvider router={router} />
    </ChakraProvider>
  );
}

export default App;

