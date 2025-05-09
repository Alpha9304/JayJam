import { trpc } from "@/trpc/client";
import { useEffect } from "react";
import { toast } from "sonner";

interface SaveSisLinkProps {
    url: string;
}

export const useSaveSisLink = ({url}: SaveSisLinkProps) => {
    const mutation = trpc.sisLink.saveSisLink.useMutation()
    
    useEffect(() => {
        if (mutation.isSuccess) {
            toast.success('SIS link saved successfully');
        }
        if (mutation.isError) {
            toast.error(`Failed to save SIS link: ${mutation.error.message}`);
        }
    }, [mutation.isSuccess, mutation.isError, mutation.error]);

    const saveSisLink = () => {
        mutation.mutate({ url });
    };

    return { 
        ...mutation,
        saveSisLink 
    };
}