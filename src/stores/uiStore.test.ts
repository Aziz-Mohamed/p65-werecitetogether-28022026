import { useUIStore } from './uiStore';

const initialState = useUIStore.getState();

beforeEach(() => {
  useUIStore.setState(initialState);
});

describe('uiStore', () => {
  it('starts with openModalCount = 0', () => {
    expect(useUIStore.getState().openModalCount).toBe(0);
  });

  it('pushModal increments count', () => {
    useUIStore.getState().pushModal();
    expect(useUIStore.getState().openModalCount).toBe(1);
    useUIStore.getState().pushModal();
    expect(useUIStore.getState().openModalCount).toBe(2);
  });

  it('popModal decrements count', () => {
    useUIStore.getState().pushModal();
    useUIStore.getState().pushModal();
    useUIStore.getState().popModal();
    expect(useUIStore.getState().openModalCount).toBe(1);
  });

  it('popModal does not go below 0', () => {
    useUIStore.getState().popModal();
    expect(useUIStore.getState().openModalCount).toBe(0);

    useUIStore.getState().pushModal();
    useUIStore.getState().popModal();
    useUIStore.getState().popModal();
    expect(useUIStore.getState().openModalCount).toBe(0);
  });
});
