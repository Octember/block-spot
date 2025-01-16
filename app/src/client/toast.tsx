import { PropsWithChildren, FC, useState, createContext, useContext } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';

const ToastContext = createContext<{ toast: ToastMessage | null, setToast: (toast: ToastMessage | null) => void }>({ toast: null, setToast: () => { } });

export type ToastMessage = {
  type?: 'success' | 'error';
  title: string;
  description?: string;
  duration?: number;
}

export const ToastProvider: FC<PropsWithChildren> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  return <ToastContext.Provider value={{ toast, setToast }}>
    {children}

    <div
      aria-live="assertive"
      className="pointer-events-none z-99999 fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
        <Transition show={Boolean(toast)}>
          <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5 transition data-[closed]:data-[enter]:translate-y-2 data-[enter]:transform data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:data-[enter]:sm:translate-x-2 data-[closed]:data-[enter]:sm:translate-y-0">
            <div className="p-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  {toast?.type === 'success' ?
                    <CheckCircleIcon aria-hidden="true" className="size-6 text-green-400" /> :
                    <ExclamationCircleIcon aria-hidden="true" className="size-6 text-red-400" />}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">{toast?.title}</p>
                  {toast?.description && <p className="mt-1 text-sm text-gray-500">{toast.description}</p>}
                </div>
                <div className="ml-4 flex shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setToast(null)
                    }}
                    className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon aria-hidden="true" className="size-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </ToastContext.Provider>
}

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return (toast: ToastMessage) => {
    context.setToast({ ...toast, type: toast.type || 'success' });
    setTimeout(() => {
      context.setToast(null);
    }, toast.duration || 4000);
  }
}
