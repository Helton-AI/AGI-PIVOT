"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SUI_NETWORK = "testnet";
const SUI_VIEW_TX_URL = `https://suiscan.xyz/${SUI_NETWORK}/tx`;
const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/${SUI_NETWORK}/object`;

/**
 * Handler for submit events from the HTML form.
 *
 * Stores the blob provided in the form, and disable the default HTML form submission.
 */
export async function onSubmit(previousState: any, formData: any) {
    // Store and display the blob, then re-enable the form.
    const res = await storeBlob(formData)
        .then((storageInfo: any) => {
            return displayUpload(storageInfo.info, storageInfo.media_type, formData);
        })
        .catch((error) => {
            console.error(error);

            return {
                code: -3,
                errorMsg:
                    "An error occurred while uploading. Check the browser console and ensure that \
                 the aggregator and publisher URLs are correct.",
            };
        });

    return res;
}

export async function getDataList() {
    const dataListStr = cookies().get("dataList")?.value;
    if (dataListStr) {
        return JSON.parse(dataListStr);
    }
    return [];
}

/**
 * Stores the file from the HTML form on Walrus.
 */
function storeBlob(formData: { get: (arg0: string) => any }) {
    const inputFile = formData.get("file");
    const numEpochs = formData.get("numEpochs");
    const basePublisherUrl = formData.get("basePublisherUrl");

    // Submit a PUT request with the file's content as the body to the /v1/store endpoint.
    return fetch(`${basePublisherUrl}/v1/store?epochs=${numEpochs}`, {
        method: "PUT",
        body: inputFile,
    }).then((response: any) => {
        if (response.status === 200) {
            // Parse successful responses as JSON, and return it along with the
            // mime type from the the file input element.
            return response.json().then((info: any) => {
                return { info: info, media_type: inputFile.type };
            });
        } else {
            return {
                code: -1,
                errorMsg: "Something went wrong when storing the blob!",
            };
        }
    });
}

/**
 * Display the result of uploading the file to Walrus.
 */
function displayUpload(
    storage_info: { alreadyCertified: { blobId: any; endEpoch: any; event: { txDigest: any } }; newlyCreated: { blobObject: { blobId: any; storage: { endEpoch: any }; id: any } } },
    media_type: string,
    formData: any
) {
    // Extract the displayed fields from either of the two successful responses:
    // - newlyCreated for blobs that have been uploaded for the first time,
    //   or whose duration has been extended.
    // - alreadyCertified for blobs that have already been uploaded and certified.
    let info;
    if (storage_info && "alreadyCertified" in storage_info) {
        info = {
            status: "Already certified",
            blobId: storage_info.alreadyCertified.blobId,
            endEpoch: storage_info.alreadyCertified.endEpoch,
            suiRefType: "Previous Sui Certified Event",
            suiRef: storage_info.alreadyCertified.event.txDigest,
            suiBaseUrl: SUI_VIEW_TX_URL,
        };
    } else if (storage_info && "newlyCreated" in storage_info) {
        info = {
            status: "Newly created",
            blobId: (storage_info as any).newlyCreated.blobObject.blobId,
            endEpoch: (storage_info as any).newlyCreated.blobObject.storage.endEpoch,
            suiRefType: "Associated Sui Object",
            suiRef: (storage_info as any).newlyCreated.blobObject.id,
            suiBaseUrl: SUI_VIEW_OBJECT_URL,
        };
    } else {
        // throw Error("Unhandled successful response!");
        return {
            code: -2,
            errorMsg: "Unhandled successful response!",
        };
    }

    // The URL used to download and view the blob.
    const baseAggregatorUrl = formData.get("baseAggregatorUrl");
    const blobUrl = `${baseAggregatorUrl}/v1/${info.blobId}`;

    // The URL for viewing the event or object on chain
    const suiUrl = `${info.suiBaseUrl}/${info.suiRef}`;

    const isImage = media_type.startsWith("image");

    const data = {
        blobId: info.blobId,
        blobUrl,
        suiUrl,
        isImage,
    };

    const dataListStr = cookies().get("dataList");

    let dataList = [];
    if (dataListStr?.value) {
        dataList = JSON.parse(dataListStr.value);
    }

    cookies().set("dataList", JSON.stringify([data, ...dataList]));

    return { code: 1, data };
}
