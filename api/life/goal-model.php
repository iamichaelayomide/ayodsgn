<?php
declare(strict_types=1);

/** Additive goal validation shared by manual and AI transactions. */
final class LifeGoalModel {
    public static function normalize(array $goal): array {
        return $goal + ['type'=>'adhoc','period'=>'','parentId'=>'','keyResultId'=>'','keyResults'=>[],
            'status'=>($goal['completed']??false)?'done':'todo','progressMode'=>'manual','completed'=>false,'archived'=>false];
    }
    private static function find(array $goals,string $id): array {
        foreach($goals as $goal)if(($goal['id']??'')===$id)return self::normalize($goal);
        throw new LifeError('This goal no longer exists.',404);
    }
    public static function period(mixed $type,mixed $value): string {
        if(!in_array($type,['quarter','month','week','day','adhoc'],true))throw new LifeError('Choose a goal period.');
        $period=LifeStore::text($value,10);
        if($type==='quarter'&&!preg_match('/^\d{4}-Q[1-4]$/',$period))throw new LifeError('Choose a quarter, for example 2026-Q4.');
        if($type==='month'&&!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/',$period))throw new LifeError('Choose a valid month.');
        if(in_array($type,['week','day'],true)){
            if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$period)||!checkdate((int)substr($period,5,2),(int)substr($period,8,2),(int)substr($period,0,4)))throw new LifeError('Choose a valid date.');
            if($type==='week'&&(new DateTimeImmutable($period))->format('N')!=='1')throw new LifeError('Choose the sprint Monday.');
        }
        return $period;
    }
    public static function activeLimit(array $goals,array $goal,?array $old=null): void {
        if($goal['type']!=='quarter'||($goal['archived']??false))return;
        // Grandfather existing plans, including over-limit records, when editing in place.
        if($old!==null&&!($old['archived']??false)&&$old['type']==='quarter'&&$old['period']===$goal['period'])return;
        $count=0;foreach($goals as $other)if(($other['id']??'')!==($goal['id']??'')&&($other['type']??'')==='quarter'&&($other['period']??'')===$goal['period']&&!($other['archived']??false))$count++;
        if($count>=3)throw new LifeError('Plan up to three active objectives per quarter. Archive an objective before adding another.');
    }
    private static function results(mixed $rows,array $old): array {
        if(!is_array($rows)||!array_is_list($rows))throw new LifeError('Provide a list of key results.');
        if(count($rows)>4){
            $oldIds=array_column($old,'id');
            if(count($rows)>count($old))throw new LifeError('Each objective supports up to four key results.');
            foreach($rows as $row)if(!is_array($row)||!in_array($row['id']??null,$oldIds,true))throw new LifeError('Each objective supports up to four key results.');
        }
        $results=[];$ids=[];
        foreach($rows as $row){
            if(!is_array($row))throw new LifeError('Check the key result fields.');
            $id=isset($row['id'])&&$row['id']!==''?LifeStore::text($row['id'],32,true):LifeStore::id();
            if(isset($ids[$id]))throw new LifeError('Each key result needs a unique ID.');$ids[$id]=true;
            $result=$row;$result['id']=$id;$result['title']=LifeStore::text($row['title']??'',200,true);$result['unit']=LifeStore::text($row['unit']??'',60);
            foreach(['baseline','current','target'] as $field){$value=$row[$field]??null;if($value!==null&&((!is_int($value)&&!is_float($value))||!is_finite((float)$value)))throw new LifeError('Key result measurements must be finite numbers or empty.');$result[$field]=$value;}
            $results[]=$result;
        }
        return $results;
    }
    /** Reconcile delivery status only inside the board transaction; reads stay passive. */
    public static function reconcile(array &$state): void {
        $indices=[];$children=[];$tasks=[];$doneLists=[];
        foreach($state['lists']??[] as $list)if($list['isDone']??false)$doneLists[$list['id']]=true;
        foreach($state['goals']??[] as $i=>$goal)if(!($goal['archived']??false))$indices[$goal['id']]=$i;
        foreach($indices as $id=>$i){$parent=$state['goals'][$i]['parentId']??'';if(isset($indices[$parent]))$children[$parent][]=$id;}
        $seen=[];foreach($state['tasks']??[] as $task){
            if(($task['archived']??false)||isset($seen[$task['id']]))continue;$seen[$task['id']]=true;
            $goalId=$task['goalId']??'';if(isset($indices[$goalId]))$tasks[$goalId][$task['id']]=isset($doneLists[$task['listId']]);
        }
        $cache=[];$visiting=[];
        $resolve=function(string $id)use(&$resolve,&$cache,&$visiting,&$state,$indices,$children,$tasks):array{
            if(isset($cache[$id]))return $cache[$id];
            if(isset($visiting[$id]))return ['tasks'=>[],'leaves'=>[]]; // Tolerate malformed legacy cycles without looping.
            $visiting[$id]=true;$delivery=['tasks'=>$tasks[$id]??[],'leaves'=>[]];
            foreach($children[$id]??[] as $child){$sub=$resolve($child);$delivery['tasks']+=$sub['tasks'];$delivery['leaves']+=$sub['leaves'];}
            $i=$indices[$id];$goal=&$state['goals'][$i];
            if(($goal['progressMode']??'manual')==='linked'){
                $total=count($delivery['tasks'])+count($delivery['leaves']);
                $done=count(array_filter($delivery['tasks']))+count(array_filter($delivery['leaves']));
                $status=$done>0?'progress':'todo';
                $measured=true;
                foreach($goal['keyResults']??[] as $result){
                    foreach(['baseline','current','target'] as $field){$number=$result[$field]??null;if((!is_int($number)&&!is_float($number))||!is_finite((float)$number)){$measured=false;break;}}
                    if(!$measured)break;
                    if(($result['target']>=$result['baseline']&&$result['current']<$result['target'])||($result['target']<$result['baseline']&&$result['current']>$result['target'])){$measured=false;break;}
                }
                if($total>0&&$done===$total&&$measured){
                    $approved=($goal['completed']??false)&&($goal['status']??'')==='done'&&!empty($goal['approval']);
                    $status=(!($state['accountabilityEnabled']??false)||$approved)?'done':'progress';
                }
                if(($goal['status']??'todo')!==$status||($goal['completed']??false)!==($status==='done'))$goal['updatedAt']=LifeStore::now();
                $goal['status']=$status;$goal['completed']=$status==='done';if(!$goal['completed'])unset($goal['approval']);
            }
            // A leaf without tasks is a single deliverable for its ancestors, never for itself.
            if(empty($children[$id])&&empty($delivery['tasks']))$delivery['leaves'][$id]=($goal['status']??(($goal['completed']??false)?'done':'todo'))==='done';
            unset($visiting[$id]);return $cache[$id]=$delivery;
        };
        foreach(array_keys($indices) as $id)$resolve((string)$id);
    }
    public static function save(array $goals,array $args,bool $needsApproval=false,string $role='owner'): array {
        $id=LifeStore::text($args['id']??'',32);$old=$id===''?null:self::find($goals,$id);
        if($old!==null&&$old['archived'])throw new LifeError('This goal is archived.');
        if($old===null&&count($goals)>=1000)throw new LifeError('Goal limit reached.');
        $goal=self::normalize($old??[]);
        foreach(['title','notes','category','type','period','parentId','keyResultId','status','progressMode','completed'] as $field)if(array_key_exists($field,$args))$goal[$field]=$args[$field];
        if(array_key_exists('parentGoalId',$args)){
            if(array_key_exists('parentId',$args)&&$args['parentId']!==$args['parentGoalId'])throw new LifeError('Choose one parent goal.');
            $goal['parentId']=$args['parentGoalId'];
        }
        $goal['title']=LifeStore::text($goal['title']??'',200,true);$goal['notes']=LifeStore::text($goal['notes']??'',10000);$goal['category']=LifeStore::text($goal['category']??'Personal',60,true);
        if($goal['type']==='day'&&($old['type']??null)!=='day')throw new LifeError('Week is the shortest goal period. Use a task for a single day.');
        $goal['period']=self::period($goal['type'],$goal['period']);$goal['parentId']=LifeStore::text($goal['parentId'],32);$goal['keyResultId']=LifeStore::text($goal['keyResultId'],32);
        if(!in_array($goal['status'],['todo','progress','done'],true))throw new LifeError('Choose a goal status.');
        if(!in_array($goal['progressMode'],['manual','linked'],true))throw new LifeError('Choose manual or linked progress.');
        if(array_key_exists('completed',$args)&&!is_bool($args['completed']))throw new LifeError('Choose a completion state.');
        if(array_key_exists('status',$args)&&array_key_exists('completed',$args)&&($args['status']==='done')!==$args['completed'])throw new LifeError('Goal status and completion must agree.');
        if(array_key_exists('completed',$args)&&!array_key_exists('status',$args))$goal['status']=$args['completed']?'done':(($old['status']??'todo')==='done'?'todo':($old['status']??'todo'));
        $goal['completed']=$goal['status']==='done';
        if($needsApproval&&$role==='owner'&&$goal['completed']&&!($old['completed']??false))throw new LifeError('Your partner must approve goal completion.',403);
        if(!$goal['completed'])unset($goal['approval']);
        if(array_key_exists('keyResults',$args))$goal['keyResults']=self::results($args['keyResults'],$old['keyResults']??[]);
        if($goal['type']!=='quarter'&&count($goal['keyResults'])&&($old===null||$goal['keyResults']!==$old['keyResults']||$goal['type']!==$old['type']))throw new LifeError('Measurable key results belong to quarterly objectives.');
        if($goal['parentId']===''){
            if($goal['keyResultId']!=='')throw new LifeError('Choose the parent objective for this key result.');
        }else{
            $parent=self::find($goals,$goal['parentId']);$required=['month'=>'quarter','week'=>'month','day'=>'week'];
            if(!isset($required[$goal['type']])||$parent['type']!==$required[$goal['type']]||$parent['archived'])throw new LifeError('Link a month to a quarter, a week to a month, or a day to a week.');
            $seen=[$id=>true];$cursor=$parent;
            while(true){if(isset($seen[$cursor['id']]))throw new LifeError('A goal cannot contain a parent cycle.');$seen[$cursor['id']]=true;if($cursor['parentId']==='')break;$cursor=self::find($goals,$cursor['parentId']);}
            $period=$goal['period'];$pp=$parent['period'];
            if($goal['type']==='month'&&(substr($period,0,4)!==substr($pp,0,4)||(int)ceil((int)substr($period,5,2)/3)!==(int)substr($pp,-1)))throw new LifeError('This month must be within the parent quarter.');
            if($goal['type']==='week'&&substr($period,0,7)!==$pp)throw new LifeError('Choose the month containing this sprint Monday.');
            if($goal['type']==='day'&&($period<$pp||$period>(new DateTimeImmutable($pp))->modify('+6 days')->format('Y-m-d')))throw new LifeError('Choose a day within the parent week.');
            if($goal['keyResultId']!==''&&($goal['type']!=='month'||!in_array($goal['keyResultId'],array_column($parent['keyResults'],'id'),true)))throw new LifeError('Choose a key result from the parent quarterly objective.');
        }
        if($old!==null)foreach($goals as $child)if(($child['parentId']??'')===$id){
            if(!($child['archived']??false)&&($goal['type']!==$old['type']||$goal['period']!==$old['period']))throw new LifeError('Keep the period type while this goal has linked goals.');
            if(($child['keyResultId']??'')!==''&&!in_array($child['keyResultId'],array_column($goal['keyResults'],'id'),true))throw new LifeError('Unlink dependent goals before removing a referenced key result.');
        }
        $goal['id']=$id?:LifeStore::id();$goal['createdAt']??=LifeStore::now();$goal['updatedAt']=LifeStore::now();self::activeLimit($goals,$goal,$old);
        return $goal;
    }
}
