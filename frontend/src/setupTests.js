
import '@testing-library/jest-dom'; 
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';


export const mockAxios = new MockAdapter(axios);


afterEach(() => {
  mockAxios.reset();
});


jest.mock('react-chartjs-2', () => ({
  Bar: () => null, 
  Scatter: () => null,
}));


window.scrollTo = jest.fn();