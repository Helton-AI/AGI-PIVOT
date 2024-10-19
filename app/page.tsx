import Nodes from "@/app/components/nodes";
import { getDataList } from "./lib/action";

export default async function Component() {
    const dataList = await getDataList();

    return <Nodes dataList={dataList} />;
}
