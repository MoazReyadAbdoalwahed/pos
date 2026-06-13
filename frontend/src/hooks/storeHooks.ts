import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <TSelected>(selector: (state: RootState) => TSelected): TSelected => {
    return useSelector(selector);
}