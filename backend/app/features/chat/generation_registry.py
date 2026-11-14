import asyncio


class GenerationRegistry:
    def __init__(self):
        self.tasks: dict[str, asyncio.Task] = {}

    def register_task(self, message_id: str, task):
        exist_task = self.tasks.get(message_id)
        if exist_task is not None and not exist_task.done():
            raise RuntimeError(f"消息{message_id}正在生成")
        self.tasks[message_id] = task

    def unregister_task(self, message_id, task):
        # 只允许登记该任务的生成流程移除自己，避免误删后续任务。
        exist_task = self.tasks.get(message_id)
        if exist_task is not task or exist_task is None:
            raise TypeError(f"消息{message_id}类型错误")
        del self.tasks[message_id]

    def cancel_task(self, message_id: str):
        exist_task = self.tasks.get(message_id)
        if exist_task is None or exist_task.done():
            raise AttributeError(f"消息{message_id}不存在或者已完成")
        exist_task.cancel()

    async def cancel_and_wait(self, message_id: str):
        exist_task = self.tasks.get(message_id)
        if exist_task is None:
            raise AttributeError(f"消息{message_id}不存在")
        if not exist_task.done():
            exist_task.cancel()
        await asyncio.gather(exist_task, return_exceptions=True)


generation_registry = GenerationRegistry()
